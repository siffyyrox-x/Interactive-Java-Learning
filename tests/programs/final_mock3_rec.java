public class Main {
 public static void main(String[] args) {
     int[] a = {3, 8, 5, 2};
     System.out.println(count(a, 0));
 }
 static int count(int[] a, int i) {
     if (i == a.length) return 0;
     int x = count(a, i + 1);
     System.out.println(a[i] + x);
     if (a[i] % 2 == 0) return x + 1;
     else return x + 2;
 }
}
