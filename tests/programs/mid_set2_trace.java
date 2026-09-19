public class MidB {
    public static void main(String[] args) {
        int a = 4, b = 9, total = 0, p = 1;
        boolean take = true;
        do {
             if (take) {
                 total += a++ + --b;
                 System.out.println(total);
             } else {
                 total -= ++a - b--;
                 System.out.println(total++);
             }
             take = !take;
             p++;
        } while (p <= 5);
    }
}
