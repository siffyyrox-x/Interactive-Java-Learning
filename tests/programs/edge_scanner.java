import java.util.Scanner;
public class Main {
  public static void main(String[] args) {
    Scanner sc = new Scanner(System.in);
    int n = sc.nextInt();
    String rest = sc.nextLine();
    System.out.println("n=" + n + " rest=[" + rest + "]");
    String line = sc.nextLine();
    System.out.println("line=[" + line + "]");
    double d = sc.nextDouble();
    String w = sc.next();
    boolean b = sc.nextBoolean();
    System.out.println(d + " " + w + " " + b);
    int sum = 0;
    while (sc.hasNextInt()) sum += sc.nextInt();
    System.out.println("sum=" + sum);
    System.out.println(sc.hasNext());
    String tail = sc.next();
    System.out.println("tail=" + tail);
    System.out.println(sc.hasNext());
  }
}
